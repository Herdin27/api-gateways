import { Injectable, Logger } from '@nestjs/common';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { firstValueFrom, throwError } from 'rxjs';
import { ProductDto } from './dto/create-product.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductService {
  private client: ClientProxy;
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('AMQP_URL')],
        queue: 'product_queue',
        queueOptions: {
          durable: false,
        },
      },
    });
  }
  async create(data: ProductDto): Promise<ProductDto> {
    return firstValueFrom(this.client.send('create_product', data)).catch(
      (err) => {
        this.logger.error('Failed to create task', err);
        return throwError(err);
      },
    );
  }

  async findAll(): Promise<ProductDto[]> {
    return firstValueFrom(this.client.send('get_all_products', {})).catch(
      (err) => {
        this.logger.error('Failed to create task', err.stack);
        return throwError(err);
      },
    );
  }

  async findOne(id: number): Promise<ProductDto> {
    return firstValueFrom(this.client.send('get_product', id));
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDto> {
    return firstValueFrom(
      this.client.send('update_product', { id, updateProductDto }),
    ).catch((err) => {
      this.logger.error('Failed to create task', err.stack);
      return throwError(err);
    });
  }

  async remove(id: number): Promise<ProductDto> {
    return firstValueFrom(this.client.send('delete_product', id)).catch(
      (err) => {
        this.logger.error('Failed to create task', err.stack);
        return throwError(err);
      },
    );
  }
}
